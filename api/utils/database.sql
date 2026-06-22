CREATE TABLE IF NOT EXISTS Library(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(200) NOT NULL,
   description VARCHAR(500),
   type VARCHAR(50),
   demographic VARCHAR(50),
   published VARCHAR(50),
   status VARCHAR(50),
   artist VARCHAR(50),
   author VARCHAR(50),
   theme VARCHAR(50),
   publishers VARCHAR(50),
   cover_path VARCHAR(255),
   cover_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Tag(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(50),
   type VARCHAR(50),
   id_library INT NOT NULL,
   FOREIGN KEY(id_library) REFERENCES Library(id)
);

CREATE TABLE IF NOT EXISTS AssociativeTitle(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   title VARCHAR(200),
   id_library INT NOT NULL,
   FOREIGN KEY(id_library) REFERENCES Library(id)
);


CREATE TABLE IF NOT EXISTS UserCategory(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(50),
   description VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS Subscription(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Permissions(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Languages(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Client(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name VARCHAR(24),
   code VARCHAR(4),
   email VARCHAR(50),
   password VARCHAR(50),
   date_of_birth DATE,
   google_id VARCHAR(100),
   id_subscription INT NOT NULL,
   UNIQUE (name, code) ON CONFLICT ROLLBACK,
   FOREIGN KEY(id_subscription) REFERENCES Subscription(id)
);

CREATE TABLE IF NOT EXISTS ClientCategoryAssignment(
   name_client VARCHAR(24),
   id_user_category INT,
   PRIMARY KEY(name_client, id_user_category),
   FOREIGN KEY(name_client) REFERENCES client(name),
   FOREIGN KEY(id_user_category) REFERENCES UserCategory(id)
);

CREATE TABLE IF NOT EXISTS libraryusage(
	id_library INT,
	name_client VARCHAR(24),
   score DECIMAL(15,1),
   note VARCHAR(500),
   last_chapter VARCHAR(50),
   reading_status VARCHAR(50),
	PRIMARY KEY(id_library, name_client),
	FOREIGN KEY(id_library) REFERENCES Library(id),
	FOREIGN KEY(name_client) REFERENCES client(name)
);

CREATE TABLE IF NOT EXISTS SubscriptionPermissions(
   id_subscription INT,
   id_permissions INT,
   PRIMARY KEY(id_subscription, id_permissions),
   FOREIGN KEY(id_subscription) REFERENCES Subscription(id),
   FOREIGN KEY(id_permissions) REFERENCES Permissions(id)
);

CREATE TABLE IF NOT EXISTS LangPref(
   id_library INT,
   id_languages INT,
   PRIMARY KEY(id_library, id_languages),
   FOREIGN KEY(id_library) REFERENCES Library(id),
   FOREIGN KEY(id_languages) REFERENCES Languages(id)
);

CREATE TABLE IF NOT EXISTS Source(
    id_source INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS LastChapters(
    id_library INTEGER,
    id_source INTEGER,
    chapter VARCHAR(50),
    url VARCHAR(200),
    PRIMARY KEY(id_library, id_source),
    FOREIGN KEY(id_library) REFERENCES Library(id),
    FOREIGN KEY(id_source) REFERENCES Source(id_source)
);

CREATE TABLE IF NOT EXISTS LibrarySource(
    id_library INTEGER,
    id_source INTEGER,
    url VARCHAR(200),
    PRIMARY KEY(id_library, id_source),
    FOREIGN KEY(id_library) REFERENCES Library(id),
    FOREIGN KEY(id_source) REFERENCES Source(id_source)
);