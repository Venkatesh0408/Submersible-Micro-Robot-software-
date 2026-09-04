import "../styles/History.css";

export default function HistoryTable() {

  const history = [

    {
      id: "M001",
      time: "10:35 AM",
      location: "Zone A",
      defect: "Crack",
      confidence: "97%",
      status: "Completed"
    },

    {
      id: "M002",
      time: "10:42 AM",
      location: "Zone B",
      defect: "Corrosion",
      confidence: "94%",
      status: "Completed"
    },

    {
      id: "M003",
      time: "10:51 AM",
      location: "Zone C",
      defect: "Leakage",
      confidence: "89%",
      status: "Review"
    },

    {
      id: "M004",
      time: "11:02 AM",
      location: "Zone D",
      defect: "Algae",
      confidence: "99%",
      status: "Completed"
    }

  ];

  return (

    <div className="history-card">

      <div className="history-header">

        <h2>📑 Inspection History</h2>

        <button>

          Download Report

        </button>

      </div>

      <table>

        <thead>

          <tr>

            <th>ID</th>

            <th>Time</th>

            <th>Location</th>

            <th>Detection</th>

            <th>Confidence</th>

            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          {

            history.map((item,index)=>(

              <tr key={index}>

                <td>{item.id}</td>

                <td>{item.time}</td>

                <td>{item.location}</td>

                <td>{item.defect}</td>

                <td>{item.confidence}</td>

                <td>

                  <span className="status">

                    {item.status}

                  </span>

                </td>

              </tr>

            ))

          }

        </tbody>

      </table>

    </div>

  );

}