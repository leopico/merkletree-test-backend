const express = require("express");
const router = express.Router();
const {
  readFile,
  writeFile,
  deleteAll,
  deleteOne,
  readHashRoot,
} = require("../controllers/user.controller");

router.route("/api/addresses").get(readFile).post(writeFile).delete(deleteAll);
router.route("/api/address/:address").delete(deleteOne);
router.route("/api/gethashroot").get(readHashRoot);

module.exports = router;
