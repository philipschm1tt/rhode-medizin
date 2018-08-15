import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Box = styled.aside`
  color: ${props => props.theme.colors.yellow};
  background-color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.baseLineHeight};
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  margin: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
  font-size: ${props => props.theme.fontSizes.smallScreens.XL};
  line-height: 1.2;

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.XL};
    line-height: 1.2;
  }
`

const Quote = props => <Box>{props.text}</Box>

Quote.propTypes = {
  text: PropTypes.string.isRequired,
}

export default Quote
