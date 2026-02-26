// TensorFlow.js service for training and predicting food demand.
const path = require('path');
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

const MODEL_DIR = path.join(__dirname, 'saved-model');
const MODEL_PATH = `file://${MODEL_DIR}`;
const META_FILE = path.join(MODEL_DIR, 'meta.json');

// Encodes categorical data into numeric values for model input.
function encodeFeatures(row) {
  return [
    Number(row.dayOfWeek),
    Number(row.timeOfDay),
    Number(row.avgDailySales),
    Number(row.foodType),
    Number(row.eventDay)
  ];
}

// Builds normalization metadata to scale inputs and output.
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
  if (max === min) {
    return 0;
  }
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

async function trainModelFromRows(rows) {
  if (!rows.length) {
    throw new Error('Training data is empty. Please upload a valid Excel file.');
  }

  const inputs = rows.map(encodeFeatures);
  const outputs = rows.map((row) => Number(row.platesRequired));

  const stats = buildNormalizationStats(inputs, outputs);
  const { normalizedInputs, normalizedOutputs } = normalizeDataset(inputs, outputs, stats);

  const xs = tf.tensor2d(normalizedInputs);
  const ys = tf.tensor2d(normalizedOutputs, [normalizedOutputs.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, inputShape: [5], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

  model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });

  await model.fit(xs, ys, {
    epochs: 150,
    batchSize: Math.min(8, normalizedInputs.length),
    shuffle: true,
    verbose: 0
  });

  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  await model.save(MODEL_PATH);
  fs.writeFileSync(META_FILE, JSON.stringify(stats, null, 2));

  tf.dispose([xs, ys]);
  model.dispose();
}

async function predictDemand(inputFeatures) {
  if (!fs.existsSync(path.join(MODEL_DIR, 'model.json')) || !fs.existsSync(META_FILE)) {
    throw new Error('Model is not trained yet. Upload training data first.');
  }

  const model = await tf.loadLayersModel(`${MODEL_PATH}/model.json`);
  const stats = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));

  const encodedInput = encodeFeatures(inputFeatures);
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

  return {
    predictedPlates: roundedPrediction,
    buffer,
    totalRecommended: roundedPrediction + buffer
  };
}

module.exports = {
  trainModelFromRows,
  predictDemand
};
