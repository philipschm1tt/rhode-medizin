import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const EmployeeTile = styled.div`
  width: 220px;
  height: 208px;
  background: top right url(${props => props.photo});
  display: flex;
  flex-direction: column-reverse;
  border-radius: 3px;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin: 20px;
`
const CaptionArea = styled.div`
  background-color: ${props => props.theme.colors.overlay};
  border: 1px solid white;
  font-size: 14px;
  line-height: ${17.3 / 14};
  padding: 5px 10px;
`

const Employee = props => (
  <EmployeeTile photo={props.photo}>
    <CaptionArea>
      {props.name}
      <br />
      {props.department}
      <br />
      {props.since}
    </CaptionArea>
  </EmployeeTile>
)

Employee.propTypes = {
  name: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  since: PropTypes.string.isRequired,
  photo: PropTypes.string.isRequired,
}

export default Employee
