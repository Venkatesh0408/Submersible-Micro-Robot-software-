import argon2 from 'argon2';
async function verify() {
  const hash = "$argon2id$v=19$m=65536,p=4,t=3$2kKBGWP5Bp/vatQPfSDzug$+mG5Ie33mg1hJ7R3u/JSfOU6j4SGp1F5Q3sFmGfM9Co";
  console.log("vsty", await argon2.verify(hash, "vsty"));
  console.log("admin", await argon2.verify(hash, "admin"));
  console.log("password", await argon2.verify(hash, "password"));
  console.log("1234", await argon2.verify(hash, "1234"));
}
verify();
