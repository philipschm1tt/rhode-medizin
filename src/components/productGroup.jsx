import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const ProductGroupTile = styled.div`
  background-color: ${props => props.theme.colors.lightYellow};
  box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  max-width: 500px;
`

const ProductGroupImage = styled.img`
  max-width: 100%;
`

const ProductGroupCaption = styled.div`
  padding: 0 10px;
`

const ProductGroupHeading = styled.h3`
  color: ${props => props.theme.colors.companyBlue};
  font-size: ${props => props.theme.fontSizes.smallScreens.L};
  line-height: ${props => props.theme.lineHeights.smallScreens.L};

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.L};
    line-height: ${props => props.theme.lineHeights.largeScreens.L};
  }
`

const ProductGroupText = styled.div`
  display: flex;
  flex-wrap: wrap;
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
  font-size: ${props => props.theme.fontSizes.smallScreens.S};
  line-height: ${props => props.theme.lineHeights.smallScreens.L};
  list-style: none;

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.S};
    line-height: ${props => props.theme.lineHeights.largeScreens.L};
  }
`

const ProductGroup = props => (
  <ProductGroupTile>
    <ProductGroupImage src={props.photo} alt="" />
    <ProductGroupCaption>
      <ProductGroupHeading>{props.name}</ProductGroupHeading>
      <ProductGroupText>
        <ProductGroupDescription>{props.description}</ProductGroupDescription>
        <ProductGroupExamples>
          {props.examples.map(example => (
            <li key={example}>{example}</li>
          ))}
        </ProductGroupExamples>
      </ProductGroupText>
    </ProductGroupCaption>
  </ProductGroupTile>
)

ProductGroup.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  examples: PropTypes.arrayOf(PropTypes.string).isRequired,
  photo: PropTypes.string.isRequired,
}

export default ProductGroup
