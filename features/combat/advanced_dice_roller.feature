Feature: Advanced Dice Roller
  As a User
  I want damage dice rolling to allow options other than an integer number of d6
  So that I can roll damage for more complex cases

  Scenario: Rolling a half-die
    Given I have an attack that does 2½d6
    When I click the damage button for the attack
    Then the full dice field should be "2"
    And the dice suffix field should be "½d6"

  Scenario: Rolling dice +1
    Given I have the damage roll dialog open
    When I enter "1" on the full dice field
    And choose "d6+1" for the dice suffix field
    Then the system rolls 1d6+1
