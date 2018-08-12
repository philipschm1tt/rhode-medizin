import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Box = styled.div`
  color: ${props => props.theme.colors.yellow};
  background-color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.baseLineHeight};
  font-size: ${props => props.theme.fontSizes.XL};
  line-height: 1.2;
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  margin: 20px;
  display: inline-block;
`

const Quote = props => <Box>{props.text}</Box>

Quote.propTypes = {
  text: PropTypes.string.isRequired,
}

export default Quote
