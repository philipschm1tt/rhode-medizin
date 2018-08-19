import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import MainGrid, { MainGridColumns } from './mainGrid'
import CallToActionButton from './callToActionButton'
import Photo from '../images/hero-image.jpg'
import ContentBox from './contentBox'

const HeroArea = MainGrid.withComponent('section').extend`
  background-image: url(${Photo});
  background-position: center center;
  background-size: cover;
  padding: ${props => props.theme.sizes.tripleBaseLineHeight}
    ${props => props.theme.sizes.outerPadding};
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};

  grid-column: 1 / -1;
  justify-self: stretch;

  > * {
    grid-column: ${MainGridColumns.mainColumn};
  }

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    @supports (display: grid) {
      padding-left: 0;
      padding-right: 0;
    }
  }
`
const Overlay = styled(ContentBox)`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  border-radius: 3px;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
`

const MainHeadline = styled.h1`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
`

const SubHeadline = styled.p`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
  margin-bottom: 0;
`

const HeroBlock = props => (
  <HeroArea>
    <Overlay>
      <MainHeadline>{props.mainHeadline}</MainHeadline>
      <SubHeadline>{props.subHeadline}</SubHeadline>
    </Overlay>
    <br />
    <CallToActionButton type="button">{props.callToAction}</CallToActionButton>
  </HeroArea>
)

HeroBlock.propTypes = {
  mainHeadline: PropTypes.string.isRequired,
  subHeadline: PropTypes.string.isRequired,
  callToAction: PropTypes.string.isRequired,
}

export default HeroBlock
