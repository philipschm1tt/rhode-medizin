import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Box = styled.aside`
  color: ${props => props.theme.colors.yellow};
  background-color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.baseLineHeight};
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  margin-left: auto;
  margin-right: auto;
  margin-bottom: ${props => props.theme.sizes.doubleBaseLineHeight};
  margin-top: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
  width: 50%;
  min-width: 260px;

  grid-column: main-column-start / side-column-end;
  justify-self: center;

  @media (max-width: ${props => props.theme.sizes.breakpoints.large}) {
    padding: ${props => props.theme.sizes.halfBaseLineHeight};
  }

  p {
    font-size: ${props => props.theme.fontSizes.smallScreens.XL};
    line-height: 1.2;
    font-weight: bold;
    margin: 0;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.XL};
      line-height: 1.2;
    }
  }

  @supports (display: grid) {
    display: grid;
    grid-template-columns: min-content 1fr;

    &::before {
      grid-column: 1;
      content: '“';
      font-size: ${props => props.theme.sizes.doubleBaseLineHeight};
      font-weight: bold;
      margin-right: ${props => props.theme.sizes.halfBaseLineHeight};
    }
  }
`

const Quote = props => (
  <Box>
    <p>{props.text}</p>
  </Box>
)

Quote.propTypes = {
  text: PropTypes.string.isRequired,
}

export default Quote
