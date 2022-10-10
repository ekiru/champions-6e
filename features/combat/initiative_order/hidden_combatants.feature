Feature: Not revealing hidden combatants
  As a GM
  I want hidden characters not to show up in the initiative order to players
  So that they are not aware of their existence

  Scenario: Hidden NPC before combat
    Given Claude is an NPC who is hidden
    When combat starts
    Then Claude should not show up in the initiative order to players
    But should show up to the GM

  Scenario: NPC unhides during combat
    Given Claude is an NPC who is hidden
    And there is currently combat ongoing
    When the GM makes Claude unhidden
    Then the players should see Claude in the initiative order
