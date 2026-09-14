import { groupAnswers } from '../lib/questionnaireSchema'
import { FLAGS } from '../lib/flags'

const FLAG_BY_KEY = Object.fromEntries(FLAGS.map((f) => [f.key, f]))

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

// Every S2 to S7 answer, by section, in workbook order, under the section
// headings the workbook uses. Each answer is shown with its question text, never
// a raw JSON key. Open-ended text is never truncated.
export default function SubmissionAnswers({ answers }) {
  const groups = groupAnswers(answers)

  return (
    <div>
      {groups.map((group) => (
        <section key={group.id} style={{ marginBottom: 32 }}>
          <h4 className="tc-h3" style={{ fontSize: 14, marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid #B6B09F' }}>
            {group.title}
          </h4>

          {group.items.map((item) => {
            const flag = FLAG_BY_KEY[item.key]
            const value = item.answer
            const blank = isBlank(value)
            const normalised = blank ? null : String(value).trim().toLowerCase()
            const raised = Boolean(flag) && normalised === flag.raisesOn

            return (
              <div key={item.key} style={{ marginBottom: 20 }}>
                <p className="tc-body" style={{ fontSize: 14, color: '#4A453B', margin: 0, marginBottom: 4 }}>
                  {item.esrs && (
                    <span className="tc-label" style={{ marginRight: 8 }}>{item.esrs}</span>
                  )}
                  {item.question}
                </p>

                <p
                  className="tc-body"
                  style={{
                    margin: 0,
                    fontWeight: blank ? 300 : 400,
                    color: blank ? '#4A453B' : '#000000',
                    fontStyle: blank ? 'italic' : 'normal',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {blank ? 'Unanswered' : String(value)}
                </p>

                {raised && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      background: '#000000',
                      color: '#F2F2F2',
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: '3px 10px',
                    }}
                  >
                    Flag raised — {flag.short}
                  </span>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
