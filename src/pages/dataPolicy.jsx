import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import Article from '../components/article'
import MainSection from '../components/mainSection'
import ContentBox from '../components/contentBox'

const DataPolicyContent = ContentBox.extend`
  ul {
    list-style: none;
  }
`

const DataPolicyPage = props => (
  <Layout>
    <Article>
      <MainSection>
        <DataPolicyContent
          dangerouslySetInnerHTML={{
            __html:
              props.data.dataPolicy.abschnitte[0]
                .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      </MainSection>
    </Article>
  </Layout>
)

DataPolicyPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default DataPolicyPage

export const pageQuery = graphql`
  query {
    dataPolicy: contentfulSeite(slug: { eq: "data-policy" }) {
      abschnitte {
        __typename
        ... on ContentfulTextabschnitt {
          childContentfulTextabschnittTextTextNode {
            childMarkdownRemark {
              html
            }
          }
        }
      }
    }
  }
`
