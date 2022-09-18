Feature: Modifier Boxes
  As a User (player or GM)
  I want to be able to write a modifier next to characteristics
  So that I can keep track of temporary bonuses/maluses to my character

  Scenario Outline: calculating the total
    Given my character's base <trait> is <base>
    When I set my character's <trait> modifier to <modifier>
    Then the total <trait> should be <total>

    Examples: 
      | trait   | base | modifier | total |
      | OCV     |   20 |        0 |    20 |
      | STR     |   20 |       10 |    30 |
      | Running |   20 |       -5 |    15 |

    Examples: totals cannot be negative
      | base | modifier | total |
      |   10 |      -15 |     0 |

  Scenario: Calculating characteristic rolls
    Given my character's base STR is 10
    When I set the STR modifier to 5
    Then the STR characteristic roll should have a target number of 12

  Scenario: Calculating skill rolls
    Given my character's base DEX is 15
    And my character has the Stealth skill at the full level with 0 bonus
    When I set the DEX modifier to -5
    Then the Stealth skill roll should have a target number of 11
