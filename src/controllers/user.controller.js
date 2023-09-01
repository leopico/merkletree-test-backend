const fs = require("fs");
const path = require("path");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const filePath = path.join(__dirname, "../Addresses.csv");

async function readingFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, "utf8");
    let addresses = [];

    fileStream.on("data", (chunk) => {
      const lines = chunk.split("\n");
      addresses = addresses.concat(
        lines.filter((line) => line.trim().length > 0)
      );
    });

    fileStream.on("end", () => {
      const responseArray = addresses.map((address) => address.trim());
      resolve(responseArray);
    });

    fileStream.on("error", (err) => {
      console.error("Error reading the file:", err);
      reject(new Error("Internal Server Error"));
    });
  });
}

const readFile = async (req, res) => {
  try {
    const data = await readingFile(filePath);
    res.json(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const writeFile = async (req, res) => {
  const newAddresses = req.body.addresses;

  if (!Array.isArray(newAddresses)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const readStream = fs.createReadStream(filePath, "utf8");
  const writeStream = fs.createWriteStream(filePath, {
    flags: "a",
    encoding: "utf8",
  });

  let existingAddresses = [];

  readStream.on("data", (chunk) => {
    const lines = chunk.split("\n");
    existingAddresses = existingAddresses.concat(
      lines.filter((line) => line.trim().length > 0)
    );
  });

  readStream.on("end", () => {
    existingAddresses = existingAddresses.map((address) => address.trim());

    const filteredNewAddresses = newAddresses.filter(
      (address) => !existingAddresses.includes(address)
    );

    if (filteredNewAddresses.length === 0) {
      return res.json({ message: "No new addresses to add." });
    }

    const updatedContent = filteredNewAddresses.join("\n") + "\n";

    writeStream.write(updatedContent);
    writeStream.end();
  });

  readStream.on("error", (err) => {
    console.error("Error reading the file:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  });

  writeStream.on("finish", () => {
    console.log("File updated successfully.");
    res.json({ message: "File updated successfully" });
  });

  writeStream.on("error", (err) => {
    console.error("Error writing to file:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  });
};

const deleteAll = async (req, res) => {
  fs.writeFile(filePath, "", "utf8", (err) => {
    if (err) {
      console.error("Error deleting all addresses:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log("All addresses deleted successfully.");
    res.json({ message: "All addresses deleted successfully" });
  });
};

const deleteOne = async (req, res) => {
  const addressToDelete = req.params.address;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const lines = data.split("\n");
    const filteredLines = lines.filter(
      (line) => line.trim() !== addressToDelete
    );

    if (filteredLines.length === lines.length) {
      console.log("Address not found.");
      return res.status(404).json({ error: "Address not found" });
    }

    const updatedContent = filteredLines.join("\n") + "\n";

    fs.writeFile(filePath, updatedContent, "utf8", (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Address deleted successfully.");
      res.json({ message: "Address deleted successfully" });
    });
  });
};

const readHashRoot = async (req, res) => {
  const readAddresses = await readingFile(filePath);
  try {
    const leafNode = readAddresses.map((x) => keccak256(x));
    const tree = new MerkleTree(leafNode, keccak256, {
      sortPairs: true,
    });
    const buf2hex = (x) => "0x" + x.toString("hex");
    const hashRoot = buf2hex(tree.getRoot());
    res.json(hashRoot);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { readFile, writeFile, deleteAll, deleteOne, readHashRoot };
