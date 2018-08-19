import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import AsideSection from './asideSection'

const Box = styled.aside`
  color: ${props => props.theme.colors.yellow};
  background-color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.baseLineHeight};
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  margin: ${props => props.theme.sizes.doubleBaseLineHeight};
  margin-top: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
  font-size: ${props => props.theme.fontSizes.smallScreens.XL};
  line-height: 1.2;
  font-weight: bold;
  width: 50%;

  grid-column: main-column-start / side-column-end;
  grid-row: ${props => (props.gridRow ? props.gridRow : 'unset')};
  justify-self: center;

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.XL};
    line-height: 1.2;
  }
`

const Quote = props => (
  <>
    <AsideSection gridRow={props.gridRow} />
    <Box gridRow={props.gridRow}>{props.text}</Box>
  </>
)

Quote.propTypes = {
  text: PropTypes.string.isRequired,
  gridRow: PropTypes.string,
}

export default Quote
