// This can be a function or an object literal.
module.exports = function() {
  return {
      flywayArgs: {
          url: 'jdbc:postgresql://localhost:5432/postgres',
          locations: 'filesystem:db/main,filesystem:db/test',
          user: 'postgres',
          password: 'mysecretpassword',
      },
  };
};
