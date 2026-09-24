const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema(
  {
    dc: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan', required: true, index: true },
    screenName: { type: String },
    itemName: { type: String, required: true },
    qty: { type: Number, required: true },
    godown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryItem', deliveryItemSchema);
