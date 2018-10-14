import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'gatsby'

import MainGrid, { MainGridColumns } from './mainGrid'
import CallToActionButton from './callToActionButton'
import ContentBox from './contentBox'

const HeroArea = styled(MainGrid)`
  background-image: url(${props => props.image});
  background-position: center center;
  background-size: cover;
  padding: ${props => props.theme.sizes.tripleBaseLineHeight}
    ${props => props.theme.sizes.outerPadding};
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};

  grid-column: 1 / -1;

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
  overflow: hidden;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  display: inline-block;
  justify-self: start;
`

const MainHeadline = styled.h1`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
`

const SubHeadline = styled.p`
  font-family: font-bold, Arial, sans-serif;
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
  margin-bottom: 0;
`

const HeroBlock = props => (
  <HeroArea image={props.image} as="header">
    <Overlay>
      <MainHeadline>{props.mainHeadline}</MainHeadline>
      <SubHeadline>{props.subHeadline}</SubHeadline>
    </Overlay>
    <br />
    <Link to="/imprint/">
      <CallToActionButton type="button">
        {props.callToAction}
      </CallToActionButton>
    </Link>
  </HeroArea>
)

HeroBlock.propTypes = {
  mainHeadline: PropTypes.string.isRequired,
  subHeadline: PropTypes.string.isRequired,
  callToAction: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
}

export default HeroBlock
