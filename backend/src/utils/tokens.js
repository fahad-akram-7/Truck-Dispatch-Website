import jwt from "jsonwebtoken";

export const createTokens = (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });
  return { accessToken, refreshToken };
};
