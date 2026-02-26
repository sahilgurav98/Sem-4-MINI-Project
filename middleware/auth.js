// Middleware for route protection.
function requireStudent(req, res, next) {
  if (!req.session.student) {
    return res.redirect('/student/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = {
  requireStudent,
  requireAdmin
};
