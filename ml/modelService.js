// TensorFlow.js service for training and predicting food demand.
// This module accepts TEXT input features from admin and Excel, then encodes
// them on the server before training/prediction.
const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const MODEL_DIR = path.join(__dirname, 'saved-model');
const META_FILE = path.join(MODEL_DIR, 'meta.json');
const MODEL_DATA_FILE = path.join(MODEL_DIR, 'model-data.json');

const CATEGORICAL_KEYS = ['dayOfWeek', 'timeOfDay', 'foodType', 'eventDay'];

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeDayValue(value) {
  const text = normalizeText(value);
  const map = {
    sun: 'sunday', sunday: 'sunday',
    mon: 'monday', monday: 'monday',
    tue: 'tuesday', tues: 'tuesday', tuesday: 'tuesday',
    wed: 'wednesday', wednesday: 'wednesday',
    thu: 'thursday', thur: 'thursday', thurs: 'thursday', thursday: 'thursday',
    fri: 'friday', friday: 'friday',
    sat: 'saturday', saturday: 'saturday'
  };

  if (map[text]) return map[text];

  if (!Number.isNaN(Number(text))) {
    const n = Number(text);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (n >= 0 && n <= 6) return days[n];
  }

  return text;
}

function normalizeTimeValue(value) {
  const text = normalizeText(value);
  const map = {
    '0': 'breakfast', breakfast: 'breakfast',
    '1': 'lunch', lunch: 'lunch',
    '2': 'dinner', dinner: 'dinner'
  };
  return map[text] || text;
}

function normalizeEventValue(value) {
  const text = normalizeText(value);
  const map = {
    '0': 'no', no: 'no', n: 'no', false: 'no',
    '1': 'yes', yes: 'yes', y: 'yes', true: 'yes'
  };
  return map[text] || text;
}

function normalizeFoodTypeValue(value) {
  return normalizeText(value);
}

function normalizeFeatureValue(key, value) {
  if (key === 'dayOfWeek') return normalizeDayValue(value);
  if (key === 'timeOfDay') return normalizeTimeValue(value);
  if (key === 'eventDay') return normalizeEventValue(value);
  if (key === 'foodType') return normalizeFoodTypeValue(value);
  return normalizeText(value);
}

function fitEncoders(rows) {
  const encoders = {};

  CATEGORICAL_KEYS.forEach((key) => {
    const uniqueValues = [];
    rows.forEach((row) => {
      const normalized = normalizeFeatureValue(key, row[key]);
      if (normalized && !uniqueValues.includes(normalized)) {
        uniqueValues.push(normalized);
      }
    });

    encoders[key] = {};
    uniqueValues.forEach((value, index) => {
      encoders[key][value] = index;
    });
  });

  return encoders;
}

function encodeCategorical(encoders, key, rawValue) {
  const normalized = normalizeFeatureValue(key, rawValue);
  const encodedValue = encoders[key]?.[normalized];

  if (encodedValue === undefined) {
    throw new Error(`Unknown ${key} value: "${rawValue}". Please use values present in training data.`);
  }

  return encodedValue;
}

function encodeFeatures(row, encoders) {
  return [
    encodeCategorical(encoders, 'dayOfWeek', row.dayOfWeek),
    encodeCategorical(encoders, 'timeOfDay', row.timeOfDay),
    Number(row.avgDailySales),
    encodeCategorical(encoders, 'foodType', row.foodType),
    encodeCategorical(encoders, 'eventDay', row.eventDay)
  ];
}

function buildNormalizationStats(inputs, outputs) {
  const numFeatures = inputs[0].length;
  const inputMins = Array(numFeatures).fill(Infinity);
  const inputMaxs = Array(numFeatures).fill(-Infinity);

  inputs.forEach((row) => {
    row.forEach((value, index) => {
      inputMins[index] = Math.min(inputMins[index], value);
      inputMaxs[index] = Math.max(inputMaxs[index], value);
    });
  });

  const outputMin = Math.min(...outputs);
  const outputMax = Math.max(...outputs);

  return { inputMins, inputMaxs, outputMin, outputMax };
}

function normalizeValue(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function denormalizeValue(value, min, max) {
  return value * (max - min) + min;
}

function normalizeDataset(inputs, outputs, stats) {
  const normalizedInputs = inputs.map((row) =>
    row.map((value, index) => normalizeValue(value, stats.inputMins[index], stats.inputMaxs[index]))
  );

  const normalizedOutputs = outputs.map((value) => normalizeValue(value, stats.outputMin, stats.outputMax));
  return { normalizedInputs, normalizedOutputs };
}

function buildModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, inputShape: [5], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
  return model;
}

async function saveModelToDisk(model) {
  if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

  const modelTopologyRaw = model.toJSON(null, false);
  const modelTopology = typeof modelTopologyRaw === 'string' ? JSON.parse(modelTopologyRaw) : modelTopologyRaw;
  const weightTensors = model.getWeights();

  const weights = await Promise.all(
    weightTensors.map(async (tensor) => ({ shape: tensor.shape, data: Array.from(await tensor.data()) }))
  );

  fs.writeFileSync(MODEL_DATA_FILE, JSON.stringify({ modelTopology, weights }, null, 2));
}

async function loadModelFromDisk() {
  const modelData = JSON.parse(fs.readFileSync(MODEL_DATA_FILE, 'utf8'));
  const model = await tf.models.modelFromJSON(modelData.modelTopology);

  const weightTensors = modelData.weights.map((weight) => tf.tensor(weight.data, weight.shape));
  model.setWeights(weightTensors);
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
  weightTensors.forEach((tensor) => tensor.dispose());

  return model;
}

async function trainModelFromRows(rows) {
  if (!rows.length) throw new Error('Training data is empty. Please upload a valid Excel file.');

  const encoders = fitEncoders(rows);
  const inputs = rows.map((row) => encodeFeatures(row, encoders));
  const outputs = rows.map((row) => Number(row.platesRequired));

  if (inputs.some((row) => row.some((value) => Number.isNaN(value)))) {
    throw new Error('Some training features are invalid. Check day/time/food/event/sales values.');
  }

  if (outputs.some((value) => Number.isNaN(value))) {
    throw new Error('Invalid numeric value in platesRequired column.');
  }

  const stats = buildNormalizationStats(inputs, outputs);
  const { normalizedInputs, normalizedOutputs } = normalizeDataset(inputs, outputs, stats);

  const xs = tf.tensor2d(normalizedInputs);
  const ys = tf.tensor2d(normalizedOutputs, [normalizedOutputs.length, 1]);
  const model = buildModel();

  await model.fit(xs, ys, {
    epochs: 150,
    batchSize: Math.max(1, Math.min(8, normalizedInputs.length)),
    shuffle: true,
    verbose: 0
  });

  await saveModelToDisk(model);
  fs.writeFileSync(META_FILE, JSON.stringify({ ...stats, encoders }, null, 2));

  tf.dispose([xs, ys]);
  model.dispose();
}

async function predictDemand(inputFeatures) {
  if (!fs.existsSync(MODEL_DATA_FILE) || !fs.existsSync(META_FILE)) {
    throw new Error('Model is not trained yet. Upload training data first.');
  }

  const model = await loadModelFromDisk();
  const stats = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));

  const encodedInput = encodeFeatures(inputFeatures, stats.encoders || {});
  const normalizedInput = encodedInput.map((value, index) =>
    normalizeValue(value, stats.inputMins[index], stats.inputMaxs[index])
  );

  const inputTensor = tf.tensor2d([normalizedInput]);
  const predictionTensor = model.predict(inputTensor);
  const normalizedPrediction = predictionTensor.dataSync()[0];

  const predictedPlates = denormalizeValue(normalizedPrediction, stats.outputMin, stats.outputMax);
  const roundedPrediction = Math.max(0, Math.round(predictedPlates));
  const buffer = Math.ceil(roundedPrediction * 0.1);

  tf.dispose([inputTensor, predictionTensor]);
  model.dispose();

  return { predictedPlates: roundedPrediction, buffer, totalRecommended: roundedPrediction + buffer };
}

module.exports = {
  trainModelFromRows,
  predictDemand
};
