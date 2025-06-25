import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  address: string;
  state: string;
  country: string;
  email?: string;
  phone: string;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'UAE' },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default CustomerModel;