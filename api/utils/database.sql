CREATE TABLE IF NOT EXISTS Library(
   id INT,
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
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS Tag(
   id INT,
   name VARCHAR(50),
   type VARCHAR(50),
   id_library INT NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(id_library) REFERENCES Library(id)
);

CREATE TABLE IF NOT EXISTS AssociativeTitle(
   id INT,
   title VARCHAR(200),
   id_library INT NOT NULL,
   PRIMARY KEY(id),
   FOREIGN KEY(id_library) REFERENCES Library(id)
);

CREATE TABLE IF NOT EXISTS UserLibrary(
   id INT,
   score DECIMAL(15,1),
   note VARCHAR(500),
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS UserCategory(
   id INT,
   name VARCHAR(50),
   description VARCHAR(150),
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS Subscription(
   id INT,
   name VARCHAR(50),
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS Permissions(
   id INT,
   name VARCHAR(50),
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS Languages(
   id INT,
   name VARCHAR(50),
   PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS Client(
   name VARCHAR(24),
   email VARCHAR(50),
   password VARCHAR(50),
   display_name VARCHAR(24),
   date_of_birth DATE,
   id_subscription INT NOT NULL,
   id_user_library INT NOT NULL,
   PRIMARY KEY(name),
   UNIQUE(id_user_library),
   FOREIGN KEY(id_subscription) REFERENCES Subscription(id),
   FOREIGN KEY(id_user_library) REFERENCES UserLibrary(id)
);

CREATE TABLE IF NOT EXISTS ClientCategoryAssignment(
   id_user_library INT,
   id_user_category INT,
   PRIMARY KEY(id_user_library, id_user_category),
   FOREIGN KEY(id_user_library) REFERENCES UserLibrary(id),
   FOREIGN KEY(id_user_category) REFERENCES UserCategory(id)
);

CREATE TABLE IF NOT EXISTS LibraryUsage(
   id_library INT,
   id_user_library INT,
   PRIMARY KEY(id_library, id_user_library),
   FOREIGN KEY(id_library) REFERENCES Library(id),
   FOREIGN KEY(id_user_library) REFERENCES UserLibrary(id)
);

CREATE TABLE IF NOT EXISTS SubscriptionPermissions(
   id_subscription INT,
   id_permissions INT,
   PRIMARY KEY(id_subscription, id_permissions),
   FOREIGN KEY(id_subscription) REFERENCES Subscription(id),
   FOREIGN KEY(id_permissions) REFERENCES Permissions(id)
);

CREATE TABLE IF NOT EXISTS Asso_9(
   id_library INT,
   id_languages INT,
   PRIMARY KEY(id_library, id_languages),
   FOREIGN KEY(id_library) REFERENCES Library(id),
   FOREIGN KEY(id_languages) REFERENCES Languages(id)
);