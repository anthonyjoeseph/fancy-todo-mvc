INSERT INTO todos (user_id, text)
  SELECT
    users.id, 'Learn fp-ts'
  FROM
    users
  WHERE
    users.name = 'A.G.';

INSERT INTO todos (user_id, text)
  SELECT
    users.id, 'Exercise'
  FROM
    users
  WHERE
    users.name = 'A.G.';

INSERT INTO todos (user_id, text)
  SELECT
    users.id, 'Go shopping'
  FROM
    users
  WHERE
    users.name = 'Anthony';

INSERT INTO todos (user_id, text)
  SELECT
    users.id, 'Read Jesmyn Ward'
  FROM
    users
  WHERE
    users.name = 'Anthony';