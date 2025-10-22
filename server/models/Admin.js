const UserSchema = new mongoose.Schema({
	name: String,
	email: { type: String, unique: true },
	phone: String,
	password: String,
	role: { type: String, enum: ["user", "admin"], default: "user" },
});

const User =
	mongoose.models.User || mongoose.model("User", userSchema);

export default User