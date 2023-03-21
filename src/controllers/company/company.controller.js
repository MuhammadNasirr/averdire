import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";
import { COMPANY } from "../../constants/attachment.js";
import { COMPANY_DEP_VERIFY_VALUE } from "../../constants/index.js";

const Attachment = db.Attachment;
const CompanyDepartment = db.CompanyDepartment;

export const profile = (req, res) => {
  if (req.user && req.user.id && req.user.companyId) {
    return res.status(200).send({ data: req.user.companyProfile });
  } else {
    return res.status(404).send({ message: "Company not found." });
  }
};

export const update = (req, res) => {
  req.user.companyProfile.update(
    { ...req.body },
    { where: { id: req.user.companyId } }
  )
    .then(async (company) => {
      return res.send({
        message: "Company updated successfully!",
        data: company.dataValues
      });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};

export const updateLogo = async (req, res) => {
  if (req.user && req.user.companyProfile && req.user.companyProfile.id) {
    if (req.files && req.files.logo) {
      const logo = await Attachment.saveAttachment(
        COMPANY.value,
        req.user.companyProfile.id,
        COMPANY.fields.logo,
        req
      );
      if (logo) {
        const companyProfile = await req.user.companyProfile.reload();
        return res
          .status(200)
          .send({ message: "Logo updated successfully.", data: companyProfile });
      }
    }
  }

  return res.status(500).send({ message: "Logo couldn't be updated." });
};

export const updateCover = async (req, res) => {
  if (req.user && req.user.companyProfile && req.user.companyProfile.id) {
    if (req.files && req.files.cover) {
      const cover = await Attachment.saveAttachment(
        COMPANY.value,
        req.user.companyProfile.id,
        COMPANY.fields.cover,
        req
      );
      if (cover) {
        const companyProfile = await req.user.companyProfile.reload();
        return res
          .status(200)
          .send({ message: "Cover photo updated successfully.", data: companyProfile });
      }
    }
  }

  return res.status(500).send({ message: "Cover photo couldn't be updated." });
};

export const listDepartments = (req, res) => {
  CompanyDepartment.findAll({
    where: { companyId: req.user.companyId }
  })
  .then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
};

export const createDepartment = (req, res) => {
  CompanyDepartment.create({
    ...req.body,
    companyId: req.user.companyId,
    isVerified: COMPANY_DEP_VERIFY_VALUE.verified
  })
  .then(async (data) => {
    const newD = await data.reload();
    res.status(200).send({ message: 'Department created successfully!', data: newD });
  })
  .catch((err) => {
    let errArray = convertSequalizeErrors(err);
    return res.status(500).send({ errors: errArray });
  });
};

export const updateDepartment = (req, res) => {
  CompanyDepartment.findOne({
    where: {
        id: req.params.modelId,
        companyId: req.user.companyId
      }
  })
  .then((dep) => {
    if (!dep) {
      return res.status(404).send({ message: 'Department Not found.' });
    }
    dep.update({ ...req.body })
      .then(async (data) => {
        res.status(200).send({ message: 'Department updated successfully!', data: data });
      })
      .catch((err) => {
        let errArray = convertSequalizeErrors(err);
        return res.status(500).send({ errors: errArray });
      });
  })
  .catch((err) => {
    res.status(500).send({ message: err.message });
  });
};

export const viewDepartment = (req, res) => {
  CompanyDepartment.findOne({
    where: {
        id: req.params.modelId,
        companyId: req.user.companyId
      }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'Department Not found.' });
    }
    res.status(200).send({ data });
  })
  .catch((err) => {
    res.status(500).send({ message: err.message });
  });
};

export const dltDepartment = (req, res) => {
  CompanyDepartment.destroy({
    where: {
      id: req.params.modelId,
      companyId: req.user.companyId
    }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'Department not found or you are not authorized to delete it.' });
    }
    res.status(200).send({ message: 'Department deleted successfully' });
  })
  .catch((err) => {
    res.status(500).send({ message: err.message });
  });
};