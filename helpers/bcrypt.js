const bcrypt = require('bcryptjs');

class BcryptHelper {
  static async hashPassword(plainPassword) {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password: ' + error.message);
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error('Error comparing password: ' + error.message);
    }
  }
}

module.exports = BcryptHelper;
