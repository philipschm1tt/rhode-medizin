import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Tile = styled.div`
  min-width: 141px;
  height: 182px;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  position: relative;
`

const Photo = styled(Img)`
  position: absolute !important;
  top: 0;
  right: 0;
`

const CaptionArea = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  /*font-family: font-bold, Arial, sans-serif;*/
  font-family: Arial, sans-serif;
  font-weight: bold;
  font-size: 14px;
  line-height: ${17.3 / 14};
  padding: 5px 10px;
`

const EmployeeTile = ({ name, department, photo }) => (
  <Tile>
    <Photo fixed={photo} />
    <CaptionArea>
      {name}
      <br />
      {department}
    </CaptionArea>
  </Tile>
)

EmployeeTile.propTypes = {
  name: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  photo: PropTypes.object.isRequired,
}

export default EmployeeTile
