const ClientHistory = require('../models/clientHistory');

const addClientHistory = async (req, res) => {
  const { clientId, enquiryStatus } = req.body;

  try {
    const history = new ClientHistory({ clientId, enquiryStatus });
    await history.save();
    res.status(201).json({ message: 'Client history entry added successfully', history });
  } catch (err) {
    res.status(500).json({ message: 'Error adding client history', error: err.message });
  }
};

const getClientHistory = async (req, res) => {
  const { clientId } = req.params;

  try {
    const history = await ClientHistory.find({ clientId }).populate('clientId', 'name email');

    res.status(200).json({ message: 'Client history fetched successfully', history });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching client history', error: err.message });
  }
};

module.exports = { addClientHistory, getClientHistory };