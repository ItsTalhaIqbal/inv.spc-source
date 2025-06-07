import mongoose, { Schema, Document } from 'mongoose';




export interface ICustomer extends Document {
  name: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
}                                                                             

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default:"UAE" },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);