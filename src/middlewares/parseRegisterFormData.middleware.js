export const parseRegisterFormData = (req, res, next) => {
  try {
    if (req.body.fullname) {
      req.body.fullname = JSON.parse(req.body.fullname);
    }

    if (req.body.semester) {
      req.body.semester = Number(req.body.semester);
    }

    if (req.body.batchYear) {
      req.body.batchYear = Number(req.body.batchYear);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid form data",
    });
  }
};
