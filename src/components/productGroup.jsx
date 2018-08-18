import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import ContentBox from './contentBox'

const ProductGroupTile = styled.div`
  background-color: ${props => props.theme.colors.lightYellow};
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  max-width: 100%;

  @media (min-width: 900px) {
    min-height: 260px;
    display: grid;
    grid-template-columns: 1fr 1.618fr;
    grid-template-rows: min-content 1fr;

    @supports (display: grid) {
      max-width: none;

      h3 {
        margin-top: 0;
      }
    }
  }
`

const ProductGroupImage = styled.div`
  max-width: 100%;
  height: 260px;

  background-image: url(${props => props.photo});
  background-size: cover;
  background-position: center center;

  grid-row: span 2;
`

const ProductGroupText = styled(ContentBox)`
  @media (min-width: 550px) {
    padding: ${props => props.theme.sizes.baseLineHeight};

    @supports (display: grid) {
      display: grid;
      grid-column-gap: ${props => props.theme.sizes.baseLineHeight};
      grid-template-columns: 1.618fr 1fr;

      > p,
      > ol,
      > ul {
        margin: 0;
      }
    }
  }
`

const ProductGroupHeading = styled.h3`
  color: ${props => props.theme.colors.companyBlue};
  font-size: ${props => props.theme.fontSizes.smallScreens.L};
  line-height: ${props => props.theme.lineHeights.smallScreens.L};

  grid-column: span 2;

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.L};
    line-height: ${props => props.theme.lineHeights.largeScreens.L};
  }
`

const ProductGroupDescription = styled.p`
  font-size: ${props => props.theme.fontSizes.smallScreens.M};
  line-height: ${props => props.theme.lineHeights.smallScreens.M};

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.M};
    line-height: ${props => props.theme.lineHeights.largeScreens.M};
  }
`

const ProductGroupExamples = styled.ul`
  list-style: none;

  > li {
    font-size: ${props => props.theme.fontSizes.smallScreens.S};
    line-height: ${props => props.theme.lineHeights.smallScreens.S};

    @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.S};
      line-height: ${props => props.theme.lineHeights.largeScreens.S};
    }
  }
`

const ProductGroup = props => (
  <ProductGroupTile>
    <ProductGroupImage photo={props.photo} />
    <ProductGroupText>
      <ProductGroupHeading>{props.name}</ProductGroupHeading>
      <ProductGroupDescription>{props.description}</ProductGroupDescription>
      <ProductGroupExamples>
        {props.examples.map(example => (
          <li key={example}>{example}</li>
        ))}
      </ProductGroupExamples>
    </ProductGroupText>
  </ProductGroupTile>
)

ProductGroup.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  examples: PropTypes.arrayOf(PropTypes.string).isRequired,
  photo: PropTypes.string.isRequired,
}

export default ProductGroup
