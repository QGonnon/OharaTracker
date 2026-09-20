'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Partner', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(80),
      allowNull: false,
      unique: true
    },
    // 'platform' = site de lecture/visionnage mis en avant ; 'creator' = affiliation.
    kind: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'platform'
    },
    url: {
      type: Sequelize.STRING(300)
    },
    logo_url: {
      type: Sequelize.STRING(300)
    },
    description: {
      type: Sequelize.STRING(300)
    },
    // Langues couvertes par le partenaire, pour ne le montrer qu'aux bons visiteurs.
    locales: {
      type: Sequelize.ARRAY(Sequelize.STRING(5))
    },
    // Code d'affiliation : présent uniquement pour les créateurs rémunérés au filleul.
    affiliate_code: {
      type: Sequelize.STRING(24),
      unique: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_highlighted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  // Attribution du filleul : conservée sur le compte pour calculer la rémunération.
  await queryInterface.addColumn('Client', 'referred_by', {
    type: Sequelize.STRING(24)
  });

  // Les sources deja scrapees sont des partenaires de fait : on amorce la table avec elles.
  await queryInterface.sequelize.query(
    `INSERT INTO "Partner" (name, kind, url, description, locales, is_active, is_highlighted, created_at)
     VALUES
       ('MangaDex', 'platform', 'https://mangadex.org', 'Scans communautaires multilingues', ARRAY['fr','en','de','it','es'], true, true, NOW()),
       ('AniList', 'platform', 'https://anilist.co', 'Base de données et métadonnées', ARRAY['en'], true, false, NOW()),
       ('Scan-Manga', 'platform', 'https://www.scan-manga.com', 'Lecture en français', ARRAY['fr'], true, true, NOW()),
       ('Anime-Sama', 'platform', 'https://anime-sama.fr', 'Visionnage en français', ARRAY['fr'], true, true, NOW()),
       ('Asura Scans', 'platform', 'https://asuracomic.net', 'Manhwa en anglais', ARRAY['en'], true, false, NOW()),
       ('TheMovieDB', 'platform', 'https://www.themoviedb.org', 'Métadonnées films et séries', ARRAY['fr','en','de','it','es'], true, false, NOW())
     ON CONFLICT (name) DO NOTHING`
  );
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Client', 'referred_by');
  await queryInterface.dropTable('Partner');
}

export default { up, down };
