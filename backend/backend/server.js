const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const complaints = [];

app.post("/complaints", (req, res) => {
  const complaint = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  complaints.push(complaint);

  res.json({
    success: true,
    complaint
  });
});

app.get("/complaints", (req, res) => {
  res.json(complaints);
});

app.listen(8000, () => {
  console.log("Backend running on http://localhost:8000");
});