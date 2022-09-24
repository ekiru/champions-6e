Feature: Damage Class adder
  As a User
  I want the system to calculate dice to be rolled when adding damage classes
  So that I don't need to look it up on a table

  Scenario: Haymaker
    Given my character's STR is 23
    When they use a basic HTH attack
    And they add 4 DC to it with a Haymaker
    Then the dice to be rolled should be 8½d6

  Scenario: Adding DCs to Drain
    Given my character has a Drain with 6d6
    When they add 3 DC to it
    Then the dice to be rolled should be 7 ½ d6

  Scenario: Adding STR to a HKA
    Given my character has a HKA with 2d6
    When they add 4 DC to it
    Then the dice to be rolled should be 3d6+1

  Scenario: Reducing damage below 0 DC
    Given my character's STR is 10
    When they use a basic HTH attack
    And they subtract 3 DC from it
    Then te dice to be rolled should be 0d6

  Scenario: Specifying AP per d6
    Given my character has an attack
    When I edit the attack
    And change the attack's AP per d6 to 7½
    Then the attack should cost 7½ AP per d6

  Scenario: AP per d6 for Killing Attacks
    Given my character has an attack
    When I change the attack to do Killing Damage
    Then the attack should cost 15 AP per d6
