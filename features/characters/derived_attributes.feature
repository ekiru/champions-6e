Feature: Derived attributes for characteristics
  As a User
  I want my characteristic TNs, Phases, and lifting weight to be calculated automatically
  So that I don't have to look them up or calculate them myself

  Scenario: Showing characteristic TNs
    Given I have my character sheet open
    When my EGO is 7
    Then I should see that my EGO roll has a target number of 10

  Scenario Outline: phases
    When my Speed is <speed>
    Then I should have Phases on segments <segments>

    Examples: 
      | speed | segments        |
      |     2 |           6, 12 |
      |     5 | 3, 5, 8, 10, 12 |

  Scenario Outline: lifting weight
    When my STR is <str>
    Then my lifting weight should be <weight>

    Examples: 
      | str | weight     |
      |   0 |       0 kg |
      |  10 |     100 kg |
      |  20 |     400 kg |
      |  40 |    6400 kg |
      |  45 |  12.5 tons |
      | 100 | 25000 tons |
