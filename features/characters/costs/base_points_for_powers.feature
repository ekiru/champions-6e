Feature: Base Point Calculation for powers
  As a User
  I want the character sheet to calculate the base point cost of my powers
  So that I don't have to use the gdocs sheet for all my build calculations

  Scenario Outline: Powers that cost per die
    Given I have a <power> Power with <dice> dice
    Then the Base point cost of the power should be <base points>

    Examples: 
      | power        | dice | base points |
      | Blast        |    2 |          10 |
      | Healing      |    6 |          60 |
      | Mental Blast |  2.5 |          25 |

  Scenario Outline: Powers that cost per meter
    Given I have a <power> Power with <meters> of movement
    Then the Base Point cost of the power should be <base points>

    Examples: 
      | power    | meters | base points |
      | Running  |      3 |           3 |
      | Swimming |      7 |           4 |

  Scenario: Stretching
    Given I have a Stretching Power with 23 m of distance
    Then the Base Point cost of the power should be 23

  Scenario Outline: Powers with constant cost
    Given I have a <power> Power
    Then the Base Point cost of the power should be <base points>

    Examples: 
      | power            | base points |
      | Deflection       |          20 |
      | No Hit Locations |          10 |

  Scenario: Powers with more complicated cost schedules
    Given I have an Endurance Reserve Power
    When I open the power sheet
    Then there should be a Base Cost input field
