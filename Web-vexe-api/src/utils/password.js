import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  try {
    const salt = await bcryptjs.genSalt(SALT_ROUNDS);
    return await bcryptjs.hash(password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

export default { hashPassword, comparePassword };
