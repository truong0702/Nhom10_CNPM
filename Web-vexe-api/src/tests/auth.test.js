import test from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, verifyToken } from '../utils/jwt.js';

// Setup environment variable for test
process.env.JWT_SECRET = 'test_secret_123_abc';

test('UC01 - Đăng ký: hashPassword hashes password successfully', async () => {
  const password = 'mySecretPassword123';
  const hashed = await hashPassword(password);
  
  assert.notStrictEqual(hashed, password);
  assert.strictEqual(hashed.startsWith('$2a$'), true); // bcrypt indicator
});

test('UC02 - Đăng nhập: comparePassword compares plain text and hash correctly', async () => {
  const password = 'correctPassword';
  const wrongPassword = 'wrongPassword';
  const hashed = await hashPassword(password);
  
  const isMatch = await comparePassword(password, hashed);
  assert.strictEqual(isMatch, true);
  
  const isWrongMatch = await comparePassword(wrongPassword, hashed);
  assert.strictEqual(isWrongMatch, false);
});

test('UC03 - Đổi mật khẩu: hashing new password after verification', async () => {
  const currentPassword = 'oldPassword';
  const newPassword = 'newPassword';
  
  const currentHash = await hashPassword(currentPassword);
  
  // Verify old password
  const oldMatched = await comparePassword(currentPassword, currentHash);
  assert.strictEqual(oldMatched, true);
  
  // Hash new password
  const newHash = await hashPassword(newPassword);
  assert.notStrictEqual(newHash, currentHash);
  
  const newMatched = await comparePassword(newPassword, newHash);
  assert.strictEqual(newMatched, true);
});

test('UC04 - Xem/Cập nhật Profile: generate access token and verify payload integrity', () => {
  const user = {
    id: 'user-uuid-1234',
    email: 'test@example.com',
    role: 'customer',
  };
  
  const token = generateAccessToken(user);
  assert.ok(token);
  
  const decoded = verifyToken(token, process.env.JWT_SECRET);
  assert.ok(decoded);
  assert.strictEqual(decoded.id, user.id);
  assert.strictEqual(decoded.email, user.email);
  assert.strictEqual(decoded.role, user.role);
});
