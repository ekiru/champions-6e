Feature: Changes to Initiative Order
  As a GM
  I want the initiative order to update in response to changes in SPD and DEX
  So that it reflects the new order characters act in

  Scenario: speeding up
    Given the following characters:
      | name       | SPD |
      | Number Man |   5 |
      | Skitter    |   3 |
    And it is Number Man's Phase in Segment 3
    When Number Man's SPD changes to 7
    And the GM presses the Update Phases button
    Then the Number Man's next Phase should be in segment 6
    And it should currently be Skitter's Phase in segment 4

  Scenario: speeding up to a speed whose next Phase is in the same segment
    Given the following characters
      | name       | SPD |
      | Number Man |   5 |
      | Velocity   |   7 |
    And it is Number Man's Phase in segment 8
    When Number Man's speed changes to 6
    And the GM presses the Update Phases button
    Then Number Man's next Phase should be in segment 10
    And it should currently be Velocity's Phase on segment 9

  Scenario: changing DEX in the middle of a segment
    Given the following characters
      | name     | DEX |
      | Hare     |  15 |
      | Tortoise |   8 |
    And it is Hare's Phase on segment 12
    When she lowers her DEX to 6
    Then it is still her Phase
    And the initiative order for segment 12 is still Hare, Tortoise

  Scenario: changing DEX impacts on the next segment
    Given the following characters
      | name            | DEX | SPD |
      | Millie the Mook |  10 |   3 |
      | Connie the Cop  |  12 |   3 |
    And it is Millie's Phase on segment 4
    When Millie changes her DEX to 13
    And the combat moves forward to segment 8
    Then Millie's Phase comes before Connie's in the initiative order

  Scenario: DEX collision
    Given the following characters
      | name             | DEX | SPD |
      | Carl the Citizen |  10 |   2 |
      | Connie the Cop   |  12 |   3 |
    And it is Connie's Phase on segment 8
    When Connie changes her DEX to 10
    And the combat moves forward to the next segment
    Then the system rolls initiative tie-breaks for Connie and Carl
