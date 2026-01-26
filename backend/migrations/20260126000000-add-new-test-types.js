'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     * Return a promise to correctly handle asynchronicity.
     *
     * Example:
     * return queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    await queryInterface.sequelize.query(`
      ALTER TABLE test_results 
      MODIFY COLUMN test_type ENUM(
        'squats',
        'pushups',
        'jump',
        'situps',
        'pullups',
        'running',
        'plank',
        'wall_sit',
        'burpees',
        'lunges',
        'mountain_climbers',
        'broad_jump',
        'single_leg_balance',
        'lateral_hops',
        'hand_release_pushups',
        'shuttle_run'
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     * Return a promise to correctly handle asynchronicity.
     *
     * Example:
     * return queryInterface.dropTable('users');
     */
    
    await queryInterface.sequelize.query(`
      ALTER TABLE test_results 
      MODIFY COLUMN test_type ENUM(
        'squats',
        'pushups',
        'jump'
      )
    `);
  }
};
