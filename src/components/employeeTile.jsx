import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Tile = styled.div`
  min-width: 141px;
  height: 182px;
  background: top right url(${props => props.photo});
  display: flex;
  flex-direction: column-reverse;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
`

const CaptionArea = styled.div`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  font-family: font-bold, Arial, sans-serif;
  font-size: 14px;
  line-height: ${17.3 / 14};
  padding: 5px 10px;
`

const EmployeeTile = ({ name, department, photo }) => (
  <Tile photo={photo}>
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
  photo: PropTypes.string.isRequired,
}

export default EmployeeTile
