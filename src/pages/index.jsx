import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import Article from '../components/article'
import Quote from '../components/quote'
import TileGrid from '../components/tileGrid'
import EmployeeTile from '../components/employeeTile'
import TileList from '../components/tileList'
import ProductGroup from '../components/productGroup'
import HeroBlock from '../components/heroBlock'
import MainSection from '../components/mainSection'
import AsideSection from '../components/asideSection'

import ContentBox from '../components/contentBox'
import MainGrid from '../components/mainGrid'

const IndexPage = props => {
  const employeeEdges = props.data.employees.edges
  const productGroupEdges = props.data.productGroups.edges
  return (
    <Layout>
      <Article>
        <HeroBlock
          mainHeadline="Medizintechnik mit Tradition"
          subHeadline="Medizinische Geräte, Instrumente und Mobilar für Ärzte und Krankenhäuser mit Liefer- und Aufstellservice in Oberbayern."
          callToAction="Jetzt Kontakt aufnehmen"
        />

        <MainSection>
          <ContentBox
            dangerouslySetInnerHTML={{
              __html:
                props.data.service.inhalte[0]
                  .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                  .html,
            }}
          />
        </MainSection>

        <AsideSection>
          <ContentBox
            dangerouslySetInnerHTML={{
              __html:
                props.data.service.seitenabschnitt.inhalte[0]
                  .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                  .html,
            }}
          />
        </AsideSection>

        <Quote
          text="Wir nehmen uns Zeit für Sie – Service ist unsere Stärke."
          gridRow="3"
        />

        <MainSection>
          <ContentBox>
            <h2>Wer wir sind</h2>
            <TileGrid>
              {employeeEdges.map(({ node }) => (
                <EmployeeTile
                  name={node.name}
                  department={node.dienstbereich}
                  photo={node.foto.fixed.src}
                  key={node.name}
                />
              ))}
            </TileGrid>
          </ContentBox>
        </MainSection>

        <AsideSection>
          <ContentBox>
            <h3>Qualität und Service seit 1927</h3>
            <h4>vor 1927</h4>
            <p>
              Der Firmengründer Heinrich Rhode arbeitete mit dem damals
              führenden deutschen Chirurgen Ernst Ferdinand Sauerbruch an der
              Münchener Universität.
            </p>
            <h4>1927</h4>
            <p>
              Nach dem Umzug von Ernst Ferdinand Sauerbruch nach Berlin gründete
              Heinrich Rhode den Gewerbebetrieb Rhode.
            </p>
            <h4>1957</h4>
            <p>
              Die Herren Fritz Schlumberger und Johann Schmitt führten den
              Betrieb als eingetragenes Unternehmen fort.
            </p>
            <h4>1977</h4>
            <p>
              Umwandlung der Firma in eine GmbH. Bis 2002 lenkten die Brüder
              Gerd und Werner Schmitt die Geschicke der Heinrich Rhode GmbH,
              Medizintechnik.
            </p>
            <h4>2002</h4>
            <p>
              Am zweiten Januar 2002 trat Herr Gerd Schmitt in den Ruhestand.
              Seither leiten Herr Robert Renz und Herr Werner Schmitt die Firma.
            </p>
          </ContentBox>
        </AsideSection>

        <Quote
          text="Wer an Qualität spart, spart am falschen Ende."
          gridRow="5"
        />

        <MainSection darkBackground="true" fullWidth="true">
          <MainGrid>
            <ContentBox>
              <h2>Unser Warensortiment</h2>
              <TileList>
                {productGroupEdges.map(({ node }) => (
                  <ProductGroup
                    name={node.name}
                    description={node.beschreibung.beschreibung}
                    examples={node.beispiele}
                    photo={node.foto.fixed.src}
                    key={node.name}
                  />
                ))}
              </TileList>
            </ContentBox>
          </MainGrid>
        </MainSection>
      </Article>
    </Layout>
  )
}

IndexPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default IndexPage

export const pageQuery = graphql`
  query {
    employees: allContentfulMitarbeiter {
      edges {
        node {
          name
          dienstbereich
          foto {
            fixed {
              base64
              width
              height
              src
              srcSet
              srcWebp
              srcSetWebp
            }
          }
        }
      }
    }
    productGroups: allContentfulProduktgruppe {
      edges {
        node {
          name
          beschreibung {
            beschreibung
          }
          beispiele
          foto {
            fixed {
              base64
              width
              height
              src
              srcSet
              srcWebp
              srcSetWebp
            }
          }
        }
      }
    }
    service: contentfulAbschnitt(
      titel: { eq: "Service, Beratung, Reparatur" }
    ) {
      inhalte {
        __typename
        ... on ContentfulTextabschnitt {
          childContentfulTextabschnittTextTextNode {
            childMarkdownRemark {
              html
            }
          }
        }
      }
      seitenabschnitt {
        inhalte {
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
  }
`
