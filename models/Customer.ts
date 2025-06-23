import mongoose, { Schema, Document } from 'mongoose';
import { string } from 'zod';

// Clear Mongoose cache (temporary for debugging)

export interface ICustomer extends Document {
  name: string;
  address: string;
  state: string;
  country: string;
  email?: string; // Optional
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
      sparse: true,  // This allows multiple null values
      default: undefined // Better than null
    },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

// Log schema definition
console.log('CustomerSchema defined with email options:', CustomerSchema.paths.email.options);

const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
console.log('Customer model loaded');

export default CustomerModel;