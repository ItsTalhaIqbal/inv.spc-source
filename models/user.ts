import mongoose from "mongoose";

interface IUser {
    username: string;
    email: string;
    password: string;
    role: "admin" | "salesman";
    resetCode: string | null;
    resetCodeExpiry: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            default: "salesman",
            enum: ["admin", "salesman"],
        },
        resetCode: {
            type: String,
            default: null,
        },
        resetCodeExpiry: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Check if the model has already been defined
 const User = mongoose.models.User as mongoose.Model<IUser> || mongoose.model<IUser>("User", UserSchema);

export default User