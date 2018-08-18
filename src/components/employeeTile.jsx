import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Tile = styled.div`
  min-width: 182px;
  min-height: 182px;
  background: top right url(${props => props.photo});
  display: flex;
  flex-direction: column-reverse;
  border-radius: 3px;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin-bottom: ${props => props.theme.sizes.baseLineHeight};
  margin-right: ${props => props.theme.sizes.baseLineHeight};
`
const CaptionArea = styled.div`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  font-size: 14px;
  line-height: ${17.3 / 14};
  padding: 5px 10px;
`

const EmployeeTile = props => (
  <Tile photo={props.photo}>
    <CaptionArea>
      {props.name}
      <br />
      {props.department}
      <br />
      {props.since}
    </CaptionArea>
  </Tile>
)

EmployeeTile.propTypes = {
  name: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  since: PropTypes.string.isRequired,
  photo: PropTypes.string.isRequired,
}

export default EmployeeTile
