Feature: Initiative order
  As a GM
  I want to start combat encounters and have the system track who acts next
  So that I don't need to keep track of DEX and phases manually

  Background: 
    Given the following characters:
      | name               | speed | dex |
      | Norm the Bystander |     2 |  10 |
      | Millie the Mook    |     3 |  12 |
      | Dean the Dextrous  |     2 |  12 |

  Scenario: The first turn of combat
    When I start combat with all the characters
    And Dean wins the initiative tie-break over Millie
    Then the order of combat for turn 1 should be: Dean, Millie, Norm

  Scenario: Subsequent turns
    When I start combat with all the characters
    And Millie wins the initiative tie-break over Dean
    Then the order of combat for turn 2 should be: Millie, Dean, Norm, Millie, Millie, Dean, Norm

  Scenario: The combat order table
    When I start combat with all the characters
    And Millie wins the initiative tie-break over Dean
    Then the combat order table should look like:
      | DEX | 1 | 2 | 3 |      4 | 5 |    6 | 7 |      8 | 9 | 10 | 11 |           12 |
      |  12 |   |   |   | Millie |   | Dean |   | Millie |   |    |    | Millie, Dean |
      |  10 |   |   |   |        |   | Norm |   |        |   |    |    | Norm         |
    And Millie's Phase on segment 12 should be highlighted
