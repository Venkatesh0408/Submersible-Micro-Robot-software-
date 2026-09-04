import "../styles/Gallery.css";

export default function Gallery() {

  const images = [

    {
      img: "https://picsum.photos/300/200?1",
      defect: "Crack",
      confidence: "97%",
      time: "10:42 AM"
    },

    {
      img: "https://picsum.photos/300/200?2",
      defect: "Corrosion",
      confidence: "94%",
      time: "10:45 AM"
    },

    {
      img: "https://picsum.photos/300/200?3",
      defect: "Leakage",
      confidence: "91%",
      time: "10:49 AM"
    },

    {
      img: "https://picsum.photos/300/200?4",
      defect: "Algae",
      confidence: "99%",
      time: "10:53 AM"
    }

  ];

  return (

    <div className="gallery-card">

      <div className="gallery-header">

        <h2>🖼 Inspection Gallery</h2>

        <span>Latest Captures</span>

      </div>

      <div className="gallery-grid">

        {

          images.map((item,index)=>(

            <div className="gallery-item" key={index}>

              <img
                src={item.img}
                alt={item.defect}
              />

              <div className="gallery-info">

                <h3>{item.defect}</h3>

                <p>Confidence : {item.confidence}</p>

                <small>{item.time}</small>

              </div>

            </div>

          ))

        }

      </div>

    </div>

  );

}