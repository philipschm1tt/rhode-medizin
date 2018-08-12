import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import CallToActionButton from './callToActionButton'
import Photo from '../images/hero-image.jpg'

const HeroArea = styled.div`
  background-image: url(${Photo});
  background-position: center center;
  padding-top: 40px;
  padding-bottom: 60px;
`
const Overlay = styled.div`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  border-radius: 3px;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin: 20px;
`

const MainHeadline = styled.h1`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
`

const SubHeadline = styled.p`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
`

const HeroBlock = props => (
  <HeroArea>
    <Overlay>
      <MainHeadline>{props.mainHeadline}</MainHeadline>
      <SubHeadline>{props.subHeadline}</SubHeadline>
    </Overlay>
    <CallToActionButton type="button">{props.callToAction}</CallToActionButton>
  </HeroArea>
)

HeroBlock.propTypes = {
  mainHeadline: PropTypes.string.isRequired,
  subHeadline: PropTypes.string.isRequired,
  callToAction: PropTypes.string.isRequired,
}

export default HeroBlock
