import { Tabs, TabList, Tab, TabPanels, TabPanel } from "~/ui/primitives/tabs";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import cx from "clsx";
import type {
  MetaFunction,
  HeadersFunction,
  LoaderArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { getSchedules } from "~/lib/conf2023.server";
import { CACHE_CONTROL } from "~/lib/http.server";
import { sluggify } from "~/lib/conf";

export async function loader(_: LoaderArgs) {
  let schedules = await getSchedules();
  // @ts-ignore
  let formatter = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  });
  return json(
    {
      schedules: schedules.map((schedule) => {
        return {
          ...schedule,
          dateSlug: sluggify(
            schedule.date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
            })
          ),
          dateISO: schedule.date.toISOString(),
          dateFormatted: schedule.date.toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          dateFormattedShort: schedule.date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
          }),
          sessions: schedule.sessions.map((session) => {
            let startsAt = session.startsAt ? new Date(session.startsAt) : null;
            let endsAt = session.endsAt ? new Date(session.endsAt) : null;
            return {
              ...session,
              speakersFormatted: formatter.format(
                session.speakers.map((speaker) => speaker.nameFull)
              ) as string,
              startsAtISO: startsAt?.toISOString() || null,
              startsAtFormatted:
                startsAt?.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  timeZone: "America/Denver",
                }) || null,
              endsAtISO: endsAt?.toISOString() || null,
              endsAtFormatted:
                endsAt?.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  timeZone: "America/Denver",
                }) || null,
            };
          }),
        };
      }),
    },
    { headers: { "Cache-Control": CACHE_CONTROL.conf } }
  );
}

export const meta: MetaFunction = () => ({
  title: "Remix Conf Schedule",
  description: "What's happening and when at Remix Conf",
});

export const headers: HeadersFunction = () => {
  return {
    "Cache-Control": CACHE_CONTROL.DEFAULT,
  };
};

export default function Safety() {
  let { schedules: days } = useLoaderData<typeof loader>();
  let navigate = useNavigate();
  let location = useLocation();
  let requestedDay = location.hash?.slice(1) ?? "";
  let selectedDayIndex = days.findIndex(
    ({ dateSlug }) => dateSlug === requestedDay
  );

  return (
    <div className="text-white">
      <h1 className="mb-16 font-display text-3xl font-extrabold sm:text-5xl xl:text-7xl">
        Remix Conf Schedule
      </h1>
      <div className="flex flex-col gap-10 text-lg lg:text-xl">
        <p>
          Get ready for some amazing UX/DX goodness at Remix Conf!
          <br />
          <small>
            (This is a preliminary schedule and is subject to change).
          </small>
        </p>

        <Tabs
          index={selectedDayIndex === -1 ? 0 : selectedDayIndex}
          onChange={(index) => {
            let { dateSlug } = days[index] ?? {};
            if (dateSlug) {
              navigate({ hash: `#${dateSlug}` }, { replace: true });
            }
          }}
        >
          <TabList className="flex justify-around">
            {days.map(({ dateSlug, dateFormatted, dateFormattedShort }, i) => (
              <Tab
                key={dateSlug}
                index={i}
                // tabIndex={-1}
                className="w-full whitespace-nowrap border-b-2 border-b-gray-800 py-2 px-4 data-[selected]:border-b-pink-brand data-[selected]:font-bold"
              >
                <div className="w-full">
                  <div className="hidden md:block">{dateFormatted}</div>
                  <div className="md:hidden">{dateFormattedShort}</div>
                </div>
              </Tab>
            ))}
          </TabList>

          <TabPanels className="pt-10">
            {days.map(({ dateSlug, sessions }, index) => (
              <TabPanel key={dateSlug} index={index}>
                <div>
                  <table className="mt-10 w-full border-collapse">
                    <thead className="sr-only">
                      <tr>
                        <th>Time</th>
                        <th>Speakers</th>
                        <th>Event</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody className="flex flex-col gap-6 md:gap-10">
                      {sessions.map((session) => {
                        return (
                          <tr
                            key={session.id}
                            className="schedule-row grid flex-none items-start gap-x-3 gap-y-2 md:gap-x-5"
                          >
                            <td className="schedule-row-item schedule-row-item--time text-xs uppercase text-pink-300 md:text-sm">
                              <p className="md:mt-1 md:whitespace-nowrap">
                                <span>{session.startsAtFormatted}</span> –{" "}
                                <span>{session.endsAtFormatted}</span>
                              </p>
                            </td>
                            <td className="schedule-row-item schedule-row-item--img flex flex-wrap items-center justify-center gap-y-1 -space-x-4 md:-space-x-3">
                              {session.speakers.map((speaker, _, speakers) => {
                                let speakerInitials = [
                                  speaker.nameFirst?.charAt(0),
                                  speaker.nameLast?.charAt(0),
                                ]
                                  .filter(Boolean)
                                  .join("");
                                return (
                                  <div
                                    key={speaker.id}
                                    className={cx(
                                      "flex items-center justify-center overflow-hidden rounded-full border-[1px] border-gray-600 bg-gray-800 text-center first:-ml-4 md:first:-ml-3",
                                      {
                                        "h-14 w-14 text-lg md:h-24 md:w-24 md:text-2xl":
                                          speakers.length === 1,
                                        "h-10 w-10 text-sm md:h-16 md:w-16 md:text-xl":
                                          speakers.length >= 2,
                                      }
                                    )}
                                  >
                                    {speaker.imgUrl ? (
                                      <img
                                        src={speaker.imgUrl}
                                        alt=""
                                        className="object-contain object-center"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div
                                        aria-hidden
                                        className="font-bold uppercase"
                                      >
                                        {speakerInitials}
                                      </div>
                                    )}
                                    <span className="sr-only">
                                      Presented by {session.speakersFormatted}
                                    </span>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="schedule-row-item schedule-row-item--heading flex flex-col">
                              <h3 className="text-lg font-bold md:text-xl">
                                {session.title}
                              </h3>
                              {session.speakersFormatted ? (
                                <span
                                  aria-hidden
                                  className="text-sm text-gray-300"
                                >
                                  Presented by {session.speakersFormatted}
                                </span>
                              ) : null}
                            </td>
                            <td className="schedule-row-item schedule-row-item--description">
                              <div className="flex flex-col gap-2 text-base md:gap-4">
                                {session.description
                                  ?.split(/[\n\r]/g)
                                  .filter(Boolean)
                                  .join("\n")
                                  .split("\n")
                                  .map((line, i) => (
                                    <p key={i}>{line}</p>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}
