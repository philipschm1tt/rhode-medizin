import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

import MainGrid, { MainGridColumns } from './mainGrid'
import CallToActionButton from './callToActionButton'
import ContentBox from './contentBox'

const HeroArea = styled(MainGrid)`
  grid-column: ${MainGridColumns.fullWidth};
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  grid-template-rows: ${props => props.theme.sizes.tripleBaseLineHeight} fit-content(0) ${props => props.theme.sizes.tripleBaseLineHeight};

  position: relative;
  padding: ${props => props.theme.sizes.tripleBaseLineHeight}
    ${props => props.theme.sizes.outerPadding};

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    @supports (display: grid) {
      padding: 0;
    }
  }
`

const HeroImage = styled(Img)`
  grid-column: ${MainGridColumns.fullWidth};
  grid-row: 1 / 4;
  position: absolute !important;
  z-index: 0;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`

const HeroContent = styled.div`
  grid-column: ${MainGridColumns.mainColumn};
  grid-row: 2;
  position: relative;
  z-index: 1;
  padding: 0;
`

const Overlay = styled(ContentBox)`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
  justify-self: start;
  align-self: start;

  & > :last-child {
    margin-bottom: 0;
  }
`

const Headline = styled.div`
  font-family: font-bold, Arial, sans-serif;
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
`

const HeroBlock = props => (
  <HeroArea as="header">
    <HeroImage fluid={props.image} />
    <HeroContent>
      <Overlay>
        <Headline as="h1">{props.mainHeadline}</Headline>
        <Headline as="p">{props.subHeadline}</Headline>
      </Overlay>
      <br />
      <Link to="/imprint/">
        <CallToActionButton type="button">
          {props.callToAction}
        </CallToActionButton>
      </Link>
    </HeroContent>
  </HeroArea>
)

HeroBlock.propTypes = {
  mainHeadline: PropTypes.string.isRequired,
  subHeadline: PropTypes.string.isRequired,
  callToAction: PropTypes.string.isRequired,
  image: PropTypes.object.isRequired,
}

export default HeroBlock
